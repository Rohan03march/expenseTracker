import { View, Platform, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import * as Icons from 'phosphor-react-native'

export default function CustomTabs({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
    const tabarIcons : any = {
        index:(isFocused : boolean) => (
            <Icons.House
                size={verticalScale(30)}
                weight={isFocused ? "fill": "regular"}
                color={isFocused ? colors.primary : colors.neutral400}/>
        ),
        statistices:(isFocused : boolean) => (
            <Icons.ChartBar
                size={verticalScale(30)}
                weight={isFocused ? "fill": "regular"}
                color={isFocused ? colors.primary : colors.neutral400}/>
        ),
        wallet:(isFocused : boolean) => (
            <Icons.Wallet
                size={verticalScale(30)}
                weight={isFocused ? "fill": "regular"}
                color={isFocused ? colors.primary : colors.neutral400}/>
        ),
        profile:(isFocused : boolean) => (
            <Icons.User
                size={verticalScale(30)}
                weight={isFocused ? "fill": "regular"}
                color={isFocused ? colors.primary : colors.neutral400}/>
        ),
    }
  return (
    <View style={styles.tabar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label: any =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            // href={buildHref(route.name, route.params)}
            key={route.name}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabarItem}
          >
            {
                tabarIcons[route.name] && tabarIcons[route.name](isFocused)
            }
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabar: {
    flexDirection: "row",
    width: "100%",
    height: Platform.OS == "ios" ? verticalScale(73) : verticalScale(55),
    backgroundColor: colors.neutral800,
    justifyContent: "space-between",
    alignItems: "center",
    borderTopColor: colors.neutral700,
    borderTopWidth: 1,
  },
  tabarItem: {
    marginBottom: Platform.OS == "ios" ? spacingY._10 : spacingY._5,
    margin: Platform.OS == "ios" ? spacingX._15 : spacingX._5,
    justifyContent: "center",
    alignItems: "center",
  },
});
